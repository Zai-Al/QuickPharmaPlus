import "./Buttons.css";
export default function UploadButton({ text, onUpload }) {
    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (onUpload) onUpload(file);
    };
    return (
        <label className="upload-btn">
            <i className="bi bi-upload upload-icon"></i>
            {text}
            <input
                type="file"
                className="file-input"
                accept="image/*"
                onChange={handleUpload}
            />
        </label>
    );
}