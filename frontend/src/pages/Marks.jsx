import React, { useEffect, useMemo, useState } from "react";
import { fetchMyMarksSummary } from "../api/axios";

const Marks = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exams, setExams] = useState([]);
  const [selectedExamIndex, setSelectedExamIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchMyMarksSummary();
        const list = res.data?.exams || [];
        setExams(list);
        setSelectedExamIndex(0);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load marks");
        setExams([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const graphData = useMemo(() => {
    if (exams.length === 0) return [];
    return exams.map((exam) => ({
      name: exam.examName,
      total: exam.totalObtained || 0,
      max: exam.totalMax || 0,
      percent: exam.percentage || 0,
    }));
  }, [exams]);

  const selectedExam = exams[selectedExamIndex] || null;
  const bestScore = Math.max(...exams.map((exam) => exam.percentage || 0), 0);
  const overallScore = exams.length
    ? Math.round(exams.reduce((sum, exam) => sum + (exam.percentage || 0), 0) / exams.length)
    : 0;

  return (
    <div className="space-y-7 animate-in fade-in duration-700">
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-bold">
          {error}
        </div>
      )}

      <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-indigo-700 via-violet-700 to-sky-700 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <p className="relative text-xs font-black uppercase tracking-[0.22em] text-indigo-200">Academic performance</p>
        <div className="relative mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><h1 className="text-4xl font-black tracking-tight">My Marks</h1><p className="mt-2 max-w-xl text-sm font-medium text-indigo-100">Explore your exam performance and subject-wise scores in one place.</p></div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/10 px-4 py-3"><p className="text-2xl font-black">{exams.length}</p><p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Exams</p></div>
            <div className="rounded-2xl bg-white/10 px-4 py-3"><p className="text-2xl font-black">{overallScore}%</p><p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Average</p></div>
            <div className="rounded-2xl bg-white/10 px-4 py-3"><p className="text-2xl font-black">{bestScore}%</p><p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Best</p></div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm font-black text-slate-500 animate-pulse">
          Loading marks...
        </div>
      ) : exams.length === 0 ? (
        <div className="grid min-h-80 place-items-center rounded-[2.5rem] border border-slate-100 bg-white p-10 text-center shadow-sm">
          <div>
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-indigo-50 text-4xl">📈</div>
            <h2 className="mt-6 text-2xl font-black text-slate-900">Your marks will appear here</h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500">No marks have been published yet. Once your teacher records an exam result, you can track every score and subject result here.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Bar Graph */}
          <div className="bg-white p-6 sm:p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Academic Progress</h2>
                <p className="text-slate-500 text-sm font-medium">Total score per exam (missing = 0)</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">
                {"\u{1F4CA}"}
              </div>
            </div>

            <div className="h-64 w-full flex items-end justify-around gap-6 px-4 border-b border-slate-100">
              {graphData.map((exam, i) => (
                <div key={exam.name} className="flex flex-col items-center flex-1 group h-full justify-end">
                  <div className="mb-2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    {exam.total}/{exam.max || "0"}
                  </div>
                  <div
                    className={`w-full max-w-[50px] rounded-t-2xl transition-all duration-700 cursor-pointer ${
                      selectedExamIndex === i ? "bg-indigo-600 shadow-lg shadow-indigo-200" : "bg-indigo-100 hover:bg-indigo-200"
                    }`}
                    style={{ height: `${Math.min(exam.percent, 100)}%` }}
                    onClick={() => setSelectedExamIndex(i)}
                  ></div>
                  <p
                    className={`mt-4 mb-2 text-[10px] font-black uppercase tracking-tighter ${
                      selectedExamIndex === i ? "text-indigo-600" : "text-slate-500"
                    }`}
                  >
                    {exam.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-7">
            {/* Exam list */}
            <div className="lg:w-2/3 space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 ml-2">
                Select exam to view subjects
              </h3>
              {exams.map((exam, i) => (
                <div
                  key={exam.examName}
                  onClick={() => setSelectedExamIndex(i)}
                  className={`p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer flex justify-between items-center group ${
                    selectedExamIndex === i
                      ? "bg-white border-indigo-200 shadow-xl translate-x-2"
                      : "bg-white/60 border-transparent hover:border-indigo-100 opacity-85 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${
                        selectedExamIndex === i ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-indigo-50 text-indigo-400 group-hover:bg-indigo-100"
                      }`}
                    >
                      {"\u{1F4DD}"}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{exam.examName}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total {exam.totalObtained || 0}/{exam.totalMax || 0}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-800">{exam.percentage || 0}%</p>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Score</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Subject details */}
            <div className="lg:w-1/3">
              <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl sticky top-12 border border-white/5">
                {selectedExam ? (
                  <>
                    <div className="mb-10 text-center">
                      <div className="inline-block p-4 bg-white/5 rounded-3xl mb-4">
                        <span className="text-3xl font-black text-indigo-300">{selectedExam.percentage || 0}%</span>
                      </div>
                      <h3 className="text-xl font-black tracking-tight">{selectedExam.examName}</h3>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Subject Breakdown</p>
                    </div>

                    <div className="space-y-8">
                      {(selectedExam.subjects || []).map((sub) => {
                        const percent = sub.maxMarks ? Math.round((sub.marksObtained / sub.maxMarks) * 100) : 0;
                        return (
                          <div key={sub.subject} className="group cursor-default">
                            <div className="flex justify-between mb-2 px-1">
                              <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                                {sub.subject}
                              </span>
                              <span className="text-xs font-black text-indigo-300">
                                {sub.marksObtained}
                                <span className="text-slate-500 text-[10px]"> / {sub.maxMarks}</span>
                              </span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-400 h-full rounded-full transition-all duration-700 ease-in-out"
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-slate-300 font-semibold">Select an exam to view subject scores.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Marks;
