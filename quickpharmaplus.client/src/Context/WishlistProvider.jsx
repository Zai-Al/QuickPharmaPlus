import { useContext, useEffect, useState } from "react";
import { WishlistContext } from "./WishlistContext";
import { AuthContext } from "./AuthContext";

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
                `${API_BASE}/api/Wishlist/ids?userId=${encodeURIComponent(userId)}`,
                { credentials: "include" }
            );
            if (!res.ok) {
                setWishlistCount(0);
                return;
            }

            const data = await res.json().catch(() => ({}));
            const ids = Array.isArray(data?.ids) ? data.ids : [];
            setWishlistCount(ids.length);
        } catch (e) {
            console.error("Failed to refresh wishlist count", e);
            setWishlistCount(0);
        }
    };

    useEffect(() => {
        refreshWishlistCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    return (
        <WishlistContext.Provider value={{ wishlistCount, refreshWishlistCount }}>
            {children}
        </WishlistContext.Provider>
    );
}
