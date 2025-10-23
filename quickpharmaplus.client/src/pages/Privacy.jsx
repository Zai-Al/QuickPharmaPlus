import React from 'react';

export default function Privacy() {
    const handleTestClick = () => {
        alert('Privacy test button clicked!');
        console.log('Test action triggered from Privacy page.');
    };

    return (
        <main style={{ padding: 20 }}>
            <h1>Privacy Policy</h1>
            <section>
                <p>
                    We value your privacy. This application may collect usage data to improve performance,
                    but no personal information is stored without your consent.
                </p>
                <ul>
                    <li>Data is encrypted during transmission.</li>
                    <li>We do not share your information with third parties.</li>
                    <li>You can request data deletion at any time.</li>
                </ul>
            </section>
            <button
                onClick={handleTestClick}
                style={{
                    marginTop: 20,
                    padding: '10px 20px',
                    backgroundColor: '#0078D4',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                }}
            >
                Run Privacy Test
            </button>
        </main>
    );
}