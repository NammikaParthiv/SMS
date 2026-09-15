import { useEffect, useState } from "react";

const ApiAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const showAlert = (event) => {
      const id = `${Date.now()}-${Math.random()}`;
      const message = event.detail?.message || "Something went wrong. Please try again.";
      setAlerts((current) => [...current.slice(-2), { id, message }]);
      window.setTimeout(() => {
        setAlerts((current) => current.filter((alert) => alert.id !== id));
      }, 6000);
    };

    window.addEventListener("sms-api-error", showAlert);
    return () => window.removeEventListener("sms-api-error", showAlert);
  }, []);

  if (!alerts.length) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] w-[min(24rem,calc(100vw-2rem))] space-y-3" aria-live="assertive">
      {alerts.map((alert) => (
        <div key={alert.id} role="alert" className="relative rounded-2xl border border-rose-300 bg-rose-50 p-4 pr-10 text-sm font-bold text-rose-900 shadow-2xl">
          <span className="block text-[10px] uppercase tracking-widest text-rose-600">Request failed</span>
          <span>{alert.message}</span>
          <button
            type="button"
            className="absolute ml-3 -mt-4 h-10 w-10 text-lg text-rose-700"
            aria-label="Dismiss error"
            onClick={() => setAlerts((current) => current.filter((item) => item.id !== alert.id))}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ApiAlerts;
