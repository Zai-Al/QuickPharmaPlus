import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

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

            // navbar badge should be TOTAL quantity across whole cart
            setCartCount(Number(data?.totalQuantity ?? 0));
        } catch (e) {
            console.error("Failed to refresh cart count", e);
            setCartCount(0);
        }
    };


    // Load once on login
    useEffect(() => {
        refreshCartCount();
    }, [userId]);

    return (
        <CartContext.Provider
            value={{
                cartCount,
                refreshCartCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}
