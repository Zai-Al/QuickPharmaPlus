import "./GeneralComponents.css";

export default function ImagePreview({ src }) {
    if (!src) return null;
    return <img src={src} alt="Preview" className="preview-img" />;
}