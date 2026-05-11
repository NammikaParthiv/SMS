import React, { useEffect, useState } from "react";
import { fetchClassAverageMarks } from "../../api/axios";

const AdminMarks = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classAverages, setClassAverages] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetchClassAverageMarks();
        setClassAverages(res.data?.items || []);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load class averages");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Global Marks</h1>
        <p className="text-slate-500 mt-2 font-medium">
          Class-wise average updated after every marks upload.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
        {loading ? (
          <div className="text-slate-500 font-black animate-pulse">Loading class averages...</div>
        ) : classAverages.length === 0 ? (
          <div className="text-slate-500 font-semibold">No marks recorded yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classAverages.map((row) => (
              <div key={row.classAssigned} className="p-5 rounded-3xl border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-black text-slate-900">Class {row.classAssigned}</p>
                  <span className="text-sm font-black text-slate-700">{row.average}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-indigo-600" style={{ width: `${row.average}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMarks;
