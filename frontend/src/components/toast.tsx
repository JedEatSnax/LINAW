"use client"

export default function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded ${bgColor} text-white`}>
            {message}
        </div>
    );
}