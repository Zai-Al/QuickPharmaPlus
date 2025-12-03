
export default function NavigationTab({ tabs, activeTab, onTabChange }) {
    return (
        <ul className="nav nav-tabs mb-0">
            {tabs.map((tab) => (
                <li className="nav-item" key={tab.key}>
                    <button
                        type="button"
                        className={
                            "nav-link" +
                            (activeTab === tab.key ? " active" : "") +
                            (tab.disabled ? " disabled" : "")
                        }
                        onClick={() => {
                            if (!tab.disabled) {
                                onTabChange(tab.key);
                            }
                        }}
                        disabled={tab.disabled}
                    >
                        {tab.label}
                    </button>
                </li>
            ))}
        </ul>
    );
}
