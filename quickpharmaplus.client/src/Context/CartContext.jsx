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
            const res = await fetch(`${API_BASE}/api/Cart?userId=${userId}`);
            if (!res.ok) return;

            const data = await res.json();

            // Prefer backend count if available, fallback to items length
            const countFromApi =
                typeof data?.count === "number"
                    ? data.count
                    : Array.isArray(data?.items)
                        ? data.items.length
                        : 0;

            setCartCount(countFromApi);
        } catch (e) {
            console.error("Failed to refresh cart count", e);
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
