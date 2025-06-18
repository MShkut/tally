import { useTheme } from '../../contexts/ThemeContext';

const CSVUpload = ({ onFileProcessed, isProcessing }) => {
  const { isDarkMode } = useTheme();
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    try {
      setUploadProgress(10);
      
      // Use FileReader API
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(10 + (e.loaded / e.total) * 40);
          }
        };
        reader.readAsText(file);
      });
      
      setUploadProgress(50);
      
      // Parse CSV manually since we can't use papaparse in this environment
      const lines = fileContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      setUploadProgress(90);
      setUploadProgress(100);
      onFileProcessed(data, file.name);
      
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error reading file: ' + error.message);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
        dragActive 
          ? 'border-blue-400 scale-105' 
          : isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
      } ${
        dragActive
          ? isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
          : ''
      } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {uploadProgress > 0 && (
        <div className={`absolute top-0 left-0 w-full h-1 rounded-t-xl overflow-hidden ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
      
      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        Upload Transaction CSV
      </h3>
      <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Drag and drop your CSV file here, or click to browse
      </p>
      <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Supports files from major banks and credit card providers
      </p>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        id="csv-upload"
        disabled={isProcessing}
      />
      <label
        htmlFor="csv-upload"
        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText className="w-4 h-4 mr-2" />
        Choose File
      </label>
      {isProcessing && (
        <p className="text-sm text-gray-500 mt-2">Processing file...</p>
      )}
    </div>
  );
};


export default CSVUpload;
