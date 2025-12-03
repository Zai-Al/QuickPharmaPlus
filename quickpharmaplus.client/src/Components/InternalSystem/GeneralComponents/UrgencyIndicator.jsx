export default function UrgencyIndicator({ urgent }) {
    const color = urgent ? "#D9534F" : "#28A745"; // red OR green

    return (
        <div
            style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                backgroundColor: color,
                margin: "0 auto"
            }}
        ></div>
    );
}
