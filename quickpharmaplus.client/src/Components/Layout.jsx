import Footer from "./Footer";

export default function Layout({ children }) {
    return (
        <div className="d-flex flex-column min-vh-100">
            <main className="flex-grow-1">
                {children}
            </main>
            <Footer />
        </div>
    );
}
