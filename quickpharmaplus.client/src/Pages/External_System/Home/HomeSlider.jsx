// src/Pages/Shared_Components/HomeSlider.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeSlider.css";
import Welcome from "../../../assets/Slides/welcome.png";
import healthProfile from "../../../assets/Slides/health.png";
import productsPage from "../../../assets/Slides/products-page.png";

const SLIDE_INTERVAL_MS = 8000;

const slides = [
    {
        id: "welcome",
        title: "Welcome to QuickPharma+",
        subtitle:
            "Your trusted digital pharmacy experience. Manage prescriptions, shop wellness essentials, and access health support with ease.",
        buttonText: null, // no button on this slide
        buttonLink: null,
        imageUrl: Welcome,
    },
    {
        id: "health-profile",
        title: "Build your digital health profile",
        subtitle:
            "Safely store your illnesses, allergies, and prescriptions in one place so our pharmacists can serve you faster and more accurately.",
        buttonText: "Create Health Profile",
        buttonLink: "/healthProfile",
        imageUrl: healthProfile,
    },
    {
        id: "products",
        title: "All your pharmacy needs in one click",
        subtitle:
            "Browse trusted medications, supplements, and wellness products, with delivery or in-store pickup at your convenience.",
        buttonText: "Browse Our Products",
        buttonLink: "/products",
        imageUrl: productsPage,
    },
];

export default function HomeSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timerRef = useRef(null);
    const navigate = useNavigate();

    const startAutoSlide = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, SLIDE_INTERVAL_MS);
    };

    useEffect(() => {
        startAutoSlide();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDotClick = (index) => {
        setCurrentIndex(index);
        startAutoSlide(); // reset timer after manual change
    };

    const handleButtonClick = (link) => {
        if (!link) return;
        navigate(link);
    };

    return (
        <div className="hero-slider">
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`hero-slide ${index === currentIndex ? "active" : ""
                        }`}
                    style={{
                        backgroundImage: `
                            linear-gradient(
                                to right,
                                rgba(0, 0, 0, 0.45),
                                rgba(0, 0, 0, 0.1)
                            ),
                            url(${slide.imageUrl})
                        `,
                    }}
                >
                    <div className="hero-content">
                        <h2>{slide.title}</h2>
                        {slide.subtitle && <p>{slide.subtitle}</p>}

                        {slide.buttonText && (
                            <button
                                className="hero-button"
                                onClick={() =>
                                    handleButtonClick(slide.buttonLink)
                                }
                            >
                                {slide.buttonText}
                            </button>
                        )}
                    </div>
                </div>
            ))}

            <div className="hero-dots">
                {slides.map((slide, index) => (
                    <button
                        key={slide.id}
                        className={`hero-dot ${index === currentIndex ? "active" : ""
                            }`}
                        onClick={() => handleDotClick(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
