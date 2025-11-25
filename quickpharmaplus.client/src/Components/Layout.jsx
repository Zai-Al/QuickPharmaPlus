import Footer from "./Footer";

export default function Layout({ children }) {
    return (
        <div className="d-flex flex-column min-vh-100">

            {/* NO NAVBAR HERE */}

            <main className="flex-grow-1 container py-4">
                {children}
            </main>

            <Footer />
        </div>
    );
}
