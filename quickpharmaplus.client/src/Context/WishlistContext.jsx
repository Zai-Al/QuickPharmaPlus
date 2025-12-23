import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

export const WishlistContext = createContext();

export function WishlistProvider({ children }) {
    const { user } = useContext(AuthContext);
    const userId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const [wishlistCount, setWishlistCount] = useState(0);

    const refreshWishlistCount = async () => {
        if (!userId) {
            setWishlistCount(0);
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE}/api/Wishlist/ids?userId=${userId}`, { credentials: "include", }
            );
            if (!res.ok) return;

            const data = await res.json();
            const ids = Array.isArray(data?.ids) ? data.ids : [];
            setWishlistCount(ids.length);
        } catch (e) {
            console.error("Failed to refresh wishlist count", e);
        }
    };

    // Load once on login
    useEffect(() => {
        refreshWishlistCount();
    }, [userId]);

    return (
        <WishlistContext.Provider
            value={{
                wishlistCount,
                refreshWishlistCount,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}
