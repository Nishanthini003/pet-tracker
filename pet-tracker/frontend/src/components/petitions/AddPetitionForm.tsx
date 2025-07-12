import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { getFromGemini } from "../../services/deepSeek";
import { petitions } from "../../services/api";
import type { RootState } from "../../store";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/fireBaseConfig";
import { v4 as uuidv4 } from "uuid";
import { recognize } from 'tesseract.js';
import pdfToText from 'react-pdftotext'; 
import axios from "axios";

interface AddPetitionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddPetitionForm = ({ onSuccess, onCancel }: AddPetitionFormProps) => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [extractingText, setExtractingText] = useState(false);
  const [progress, setProgress] = useState<number>(0); // Track upload progress
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [duplicateFound, setDuplicateFound] = useState(false);

  const [pdfText, setPdfText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    address: "",
    description: "",
    category: "",
    priority: "medium" as "low" | "medium" | "high",
    imageUrl: "",
    contact: "",
    submittedBy: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file) return null;
    try {
      setProgress(0);
      const imageRef = ref(storage, `images/${file.name}-${uuidv4()}`);
      const uploadTask = uploadBytesResumable(imageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgress(percent);
          },
          (error) => {
            setError("Failed to upload image. Please try again.");
            setProgress(0);
            reject(null);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setProgress(100);
            resolve(downloadURL);
          }
        );
      });
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      return null;
    }
  };

  // Function to check for duplicate petitions
  const checkForDuplicatePetition = async (title: string, description: string, address: string) => {
    try {
      const response = await axios.post("http://localhost:5000/api/petitions/findsimilar", {title, description, address});
      console.log(response);
      
      return response.data; // Assuming your API returns { exists: boolean }
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      return false;
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
  
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(permissionStatus => {
          if (permissionStatus.state === 'denied') {
            setLocationError("Location permissions were previously denied. Please enable them in your browser settings.");
          }
          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'denied') {
              setLocationError("Location permissions were denied. Please enable them in your browser settings.");
            }
          };
        });
    }
  }, []);

  const getCurrentLocationAddress = async () => {
    setIsGettingLocation(true);
    setLocationError("");
  
    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }
  
      // First try with high accuracy (may take longer)
      let position: GeolocationPosition;
      try {
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 10000, // 10 seconds
              maximumAge: 0 // Don't use cached position
            }
          );
        });
      } catch (highAccuracyError) {
        console.log("High accuracy failed, trying low accuracy...");
        // Fallback to lower accuracy if high accuracy fails
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: false,
              timeout: 5000, // 5 seconds
              maximumAge: 30000 // 30 seconds cache
            }
          );
        });
      }
  
      const { latitude, longitude } = position.coords;
  
      // Verify coordinates are valid numbers
      if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
          isNaN(latitude) || isNaN(longitude)) {
        throw new Error("Invalid coordinates received");
      }
  
      // Reverse geocoding with retry logic
      let response;
      try {
        response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              'Accept-Language': 'en',
              'User-Agent': 'YourAppName/1.0 (your@email.com)' // Required by Nominatim
            }
          }
        );
      } catch (geocodeError) {
        // Fallback to another geocoding service if Nominatim fails
        console.log("Nominatim failed, trying Mapbox...");
        response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=YOUR_MAPBOX_TOKEN`
        );
      }
  
      // Handle response based on service used
      let formattedAddress;
      if (response.data?.address) { // Nominatim response
        const { address } = response.data;
        formattedAddress = [
          address.road,
          address.neighbourhood,
          address.suburb,
          address.city,
          address.town,
          address.village,
          address.state,
          address.country
        ]
          .filter(Boolean)
          .join(", ");
      } else if (response.data?.features?.[0]?.place_name) { // Mapbox response
        formattedAddress = response.data.features[0].place_name;
      } else {
        throw new Error("Could not convert coordinates to address");
      }
  
      setFormData(prev => ({ ...prev, address: formattedAddress }));
      setLocationError("");
  
    } catch (error: any) {
      console.error("Location error:", error);
      
      let errorMessage = "Could not get location. Please enter manually.";
      
      if (error.code === 1) { // PERMISSION_DENIED
        errorMessage = "Location access was denied. Please enable permissions in your browser settings.";
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        errorMessage = "Location information is unavailable. Please check your GPS/WiFi connection.";
      } else if (error.code === 3) { // TIMEOUT
        errorMessage = "Location request timed out. Please try again.";
      } else if (error.message.includes("coordinates")) {
        errorMessage = "Invalid location data received.";
      } else if (error.message.includes("supported")) {
        errorMessage = "Geolocation is not supported by your browser.";
      }
  
      setLocationError(errorMessage);
    } finally {
      setIsGettingLocation(false);
    }
  };
  
  // New helper function
const processFormData = async (formattedData: any) => {
  try {
    const response = await axios.post(`http://localhost:5000/api/petitions/classify`, {
      title: formattedData.title,
      description: formattedData.description,
    });

    if (response.data) {
      const result = await checkForDuplicatePetition(
        formattedData.title,
        formattedData.description,
        formattedData.address
      );

      if (result.exists) {
        setError("This issue was already reported");
      }

      if(result.isResolved){
        setError("this issue was already reported and resolved ")
        setDuplicateFound(true)
      }

      setFormData(prev => ({
        ...prev,
        title: formattedData?.title || prev.title,
        description: formattedData?.description || prev.description,
        category: response?.data?.category || prev.category,
        submittedBy: formattedData?.submittedBy || prev.submittedBy,
        address: formattedData?.address || prev.address,
        contact: formattedData?.contact || prev.contact
      }));
    }
  } catch (error) {
    console.error("API Error:", error);
    setError("Failed to process form data");
  }
};

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setError("File size should be less than 10MB");
      return;
    }
  
    setImageUpload(file);
    setExtractingText(true);
    setProgress(0);
  
    try {
      // Handle PDF files
      if (file.type === 'application/pdf') {
        try {
          const extractedText = await pdfToText(file);
          setPdfText(extractedText);
          
          // Process extracted text with Gemini
          if (extractedText) {
            const formattedData = await getFromGemini(extractedText);
            if (formattedData) {
              await processFormData(formattedData);
            }
          }
        } catch (err) {
          console.error("PDF processing error:", err);
          setError("Failed to process PDF file");
        } finally {
          setExtractingText(false);
          return;
        }
      }
      // Handle image files
      else if (file.type.startsWith('image/')) {
        // Generate preview
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
  
        // Upload and process image
        const uploadedFileUrl = await uploadFile(file);
        if (!uploadedFileUrl) return;
        
        setFormData(prev => ({ ...prev, imageUrl: uploadedFileUrl }));
  
        // OCR processing
        const { data: { text } } = await recognize(file, 'eng', {
          logger: (m) => setProgress(Math.round(m.progress * 100)),
        });
  
        if (text) {
          const formattedData = await getFromGemini(text);
          if (formattedData) {
            await processFormData(formattedData);
          }
        }
      } else {
        throw new Error("Unsupported file type");
      }
    } catch (error) {
      console.error("File processing error:", error);
      setError(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExtractingText(false);
    }
  };
  
  /** Handles form submission */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await petitions.create(formData);
      console.log(response);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create petition");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Image (Optional)</label>
        <div className="mt-1 flex items-center space-x-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*,.pdf" 
          />
          {extractingText && (
            <span className="text-sm text-gray-500">
              Processing {imageUpload?.type.startsWith('image/') ? 'image' : 'PDF'}...
            </span>
          )}
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded" />
              <button type="button" className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1" onClick={() => setImagePreview(null)}>
                ✖
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="w-full bg-gray-200 rounded mt-2">
            <div
              className="bg-blue-500 text-xs font-medium text-white text-center p-1 leading-none rounded"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input type="text" name="title" className="input-field w-full border  border-gray-300 " value={formData.title} onChange={handleInputChange} required />
      </div>

      {/* Address Field - Updated with Location Button */}
    <div>
    <label className="block text-sm font-medium text-gray-700">
      Address
      <button
  type="button"
  onClick={getCurrentLocationAddress}
  disabled={isGettingLocation}
  className={`ml-2 text-sm ${
    isGettingLocation ? 'text-gray-500' : 'text-blue-600 hover:text-blue-800'
  }`}
>
  {isGettingLocation ? (
    <span className="inline-flex items-center">
      <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Detecting...
    </span>
  ) : (
    "Use my current location"
  )}
</button>
      
    </label>
    
    

    <input
      type="text"
      name="address"
      className="input-field w-full border border-gray-300 mt-1"
      value={formData.address}
      onChange={handleInputChange}
      required
    />
    
    {locationError && (
      <div className="mt-1 text-sm text-red-600 flex items-start">
        <svg className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>{locationError}</span>
      </div>
    )}
    </div>
        

      {/* Description */}
      <div>
        <label className="block text-sm w-full font-medium text-gray-700">Description</label>
        <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={4} className="input-field w-full border  border-gray-300" />
      </div>
      {/* submitted BY */}
      <div>
        <label className="block text-sm w-full font-medium text-gray-700">Submitted By</label>
        <input type="text" name="submittedBy" value={formData.submittedBy} onChange={handleInputChange} required className="input-field w-full border  border-gray-300" />
      </div>
      {/* contact */}
      <div>
        <label className="block text-sm w-full font-medium text-gray-700">Contact</label>
        <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} required className="input-field w-full border  border-gray-300" />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <input type="text" name="category" value={formData.category} onChange={handleInputChange} required className="input-field w-full border  border-gray-300" />
      </div>

      {/* Submit and Cancel Buttons */}
      <div className="flex justify-between">
        
        <button type="button" className="bg-red-500 text-white px-4 py-2 rounded" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded disabled:cursor-not-allowed" disabled={loading || duplicateFound}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
};

export default AddPetitionForm;