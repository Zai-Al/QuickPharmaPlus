import { useContext, useEffect, useState } from "react";
import { CartContext } from "./CartContext";
import { AuthContext } from "./AuthContext";

export function CartProvider({ children }) {
    const { user } = useContext(AuthContext);
    const userId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";
    const [cartCount, setCartCount] = useState(0);

    const refreshCartCount = async () => {
        if (!userId) {
            setCartCount(0);
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE}/api/Cart/summary?userId=${encodeURIComponent(userId)}`,
                { credentials: "include" }
            );

            if (!res.ok) {
                setCartCount(0);
                return;
            }

            const data = await res.json().catch(() => ({}));
            setCartCount(Number(data?.totalQuantity ?? 0));
        } catch (e) {
            console.error("Failed to refresh cart count", e);
            setCartCount(0);
        }
    };

    useEffect(() => {
        refreshCartCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    return (
        <CartContext.Provider value={{ cartCount, refreshCartCount }}>
            {children}
        </CartContext.Provider>
    );
}
