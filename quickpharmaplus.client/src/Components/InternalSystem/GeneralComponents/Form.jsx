import "./GeneralComponents.css";
export default function FormWrapper({ title, children }) {
    return (
        <div className="form-wrapper-container">
            <h5 className="form-wrapper-title">{title}</h5>
            {children}
        </div>
    );
}
