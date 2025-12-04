export default function Loader() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="spinner"></div>

      <style jsx>{`
        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e7e5e4;
          border-top-color: #000000;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
