import AdminLayout from "@/Layouts/AdminLayout";
import { Head, useForm } from "@inertiajs/react";

export default function ServiceJobsIndex({ stats = {}, jobs = [], failedJobs = [], batches = [] }) {
    const retryForm = useForm({ failed_job_id: "" });
    const closeForm = useForm({ date: "", shop_id: "" });

    return (
        <AdminLayout header="Service Jobs">
            <Head title="Service Jobs" />

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Metric label="Queued Jobs" value={stats.queued || 0} />
                    <Metric label="Failed Jobs" value={stats.failed || 0} tone="rose" />
                    <Metric label="Job Batches" value={stats.batches || 0} tone="emerald" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="font-black text-slate-900">Retry Failed Job</h3>
                        <form
                            className="mt-4 flex gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                retryForm.post(route("admin.service-jobs.retry-failed"), { preserveScroll: true });
                            }}
                        >
                            <select
                                className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5"
                                value={retryForm.data.failed_job_id}
                                onChange={(e) => retryForm.setData("failed_job_id", e.target.value)}
                                required
                            >
                                <option value="">Select failed job</option>
                                {failedJobs.map((job) => (
                                    <option key={job.id} value={job.id}>#{job.id} [{job.queue}] {job.failed_at}</option>
                                ))}
                            </select>
                            <button className="bg-slate-900 text-white rounded-xl px-4 font-bold">Retry</button>
                        </form>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <h3 className="font-black text-slate-900">Run Daily Close</h3>
                        <form
                            className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                closeForm.post(route("admin.service-jobs.daily-close"), { preserveScroll: true });
                            }}
                        >
                            <input
                                type="date"
                                className="border border-slate-300 rounded-xl px-3 py-2.5"
                                value={closeForm.data.date}
                                onChange={(e) => closeForm.setData("date", e.target.value)}
                            />
                            <input
                                type="number"
                                min="1"
                                placeholder="Shop ID (optional)"
                                className="border border-slate-300 rounded-xl px-3 py-2.5"
                                value={closeForm.data.shop_id}
                                onChange={(e) => closeForm.setData("shop_id", e.target.value)}
                            />
                            <button className="bg-orange-600 text-white rounded-xl px-4 font-bold">Run</button>
                        </form>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
                    <h3 className="font-black text-slate-900 p-5 pb-0">Queued Jobs</h3>
                    <table className="w-full text-sm mt-3">
                        <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left">ID</th>
                                <th className="px-4 py-3 text-left">Queue</th>
                                <th className="px-4 py-3 text-left">Attempts</th>
                                <th className="px-4 py-3 text-left">Available At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job) => (
                                <tr key={job.id} className="border-b border-slate-100">
                                    <td className="px-4 py-3">#{job.id}</td>
                                    <td className="px-4 py-3">{job.queue}</td>
                                    <td className="px-4 py-3">{job.attempts}</td>
                                    <td className="px-4 py-3">{new Date(Number(job.available_at) * 1000).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
                    <h3 className="font-black text-slate-900 p-5 pb-0">Job Batches</h3>
                    <table className="w-full text-sm mt-3">
                        <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left">Batch</th>
                                <th className="px-4 py-3 text-left">Total</th>
                                <th className="px-4 py-3 text-left">Pending</th>
                                <th className="px-4 py-3 text-left">Failed</th>
                                <th className="px-4 py-3 text-left">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map((row) => (
                                <tr key={row.id} className="border-b border-slate-100">
                                    <td className="px-4 py-3">{row.name}</td>
                                    <td className="px-4 py-3">{row.total_jobs}</td>
                                    <td className="px-4 py-3">{row.pending_jobs}</td>
                                    <td className="px-4 py-3">{row.failed_jobs}</td>
                                    <td className="px-4 py-3">{new Date(Number(row.created_at) * 1000).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

function Metric({ label, value, tone = "slate" }) {
    const tones = {
        slate: "text-slate-900 border-slate-200",
        rose: "text-rose-700 border-rose-200",
        emerald: "text-emerald-700 border-emerald-200",
    };

    return (
        <div className={`bg-white border rounded-2xl p-4 ${tones[tone] || tones.slate}`}>
            <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-black">{value}</p>
        </div>
    );
}
