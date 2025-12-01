import "./GeneralComponents.css";
export default function FormWrapper({ title, children }) {
    return (
        <div className="form-wrapper-container">
            <h2 className="form-wrapper-title">{title}</h2>
            {children}
        </div>
    );
}
