import React, { useState } from "react";
import { sendAdminBroadcast } from "../../api/axios";

const AdminNotifications = () => {
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!message.trim()) {
      setError("Message is required.");
      return;
    }

    setSending(true);
    try {
      const res = await sendAdminBroadcast({
        audience,
        title: title.trim(),
        message: message.trim(),
      });
      setSuccess(`Notification sent to ${res.data?.count || 0} users.`);
      setTitle("");
      setMessage("");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-4xl border border-slate-100 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Send Notification</h1>
        <p className="text-slate-500 mt-2 font-medium">
          Broadcast messages to all teachers, all students, or everyone.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl text-sm font-bold">
          {success}
        </div>
      )}

      <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-slate-900 placeholder:text-[#696969]"
            >
              <option value="all">All Teachers + Students</option>
              <option value="teachers">Teachers Only</option>
              <option value="students">Students Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none text-slate-900 placeholder:text-[#696969]"
              placeholder="Important Notice"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Message
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none resize-none text-slate-900 placeholder:text-[#696969]"
              placeholder="Type the message you want to send..."
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminNotifications;
