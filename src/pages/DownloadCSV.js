import React from 'react';

const DownloadCSV = ({ rows, filename = "search_results.csv" }) => {
    const handleDownloadCSV = () => {
        if (!rows || rows.length === 0) {
            alert("No data to download.");
            return;
        }

        // Create CSV headers
        const headers = Object.keys(rows[0]).join(",");

        // Create CSV rows
        const csvRows = rows.map(row => {
            return Object.values(row)
                .map(value => {
                    // Escape double quotes and wrap values in quotes if they contain commas
                    if (typeof value === "string" && value.includes(",")) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                })
                .join(",");
        });

        // Combine headers and rows
        const csvContent = [headers, ...csvRows].join("\n");

        // Create a Blob and trigger download
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <button type="button" onClick={handleDownloadCSV}>
            Download CSV
        </button>
    );
};

export default DownloadCSV;
