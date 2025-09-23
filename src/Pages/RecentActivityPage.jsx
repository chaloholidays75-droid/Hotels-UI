import { useEffect, useState } from "react";

export default function RecentActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20); // items per page
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [backfillLoading, setBackfillLoading] = useState(false);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://backend.chaloholidayonline.com/api/recent?page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();

      // Optional: filter locally if backend doesn't support search
      const filtered = data.filter(
        (a) =>
          a.userName.toLowerCase().includes(search.toLowerCase()) ||
          a.entity.toLowerCase().includes(search.toLowerCase()) ||
          (a.description &&
            a.description.toLowerCase().includes(search.toLowerCase()))
      );

      setActivities(filtered);
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (err) {
      console.error("Failed to fetch recent activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, search]);

  // BACKFILL HANDLER
  const handleBackfill = async () => {
    try {
      setBackfillLoading(true);
      const response = await fetch(
        "https://backend.chaloholidayonline.com/api/recent/fix-old-activities", // <-- correct endpoint
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Backfill failed");

      const result = await response.json();
      alert(result.message || "Backfill completed!");
      fetchActivities(); // refresh the list
    } catch (err) {
      console.error(err);
      alert("Failed to backfill recent activities");
    } finally {
      setBackfillLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Recent Activities</h2>

      {/* Backfill Button */}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={handleBackfill}
        disabled={backfillLoading}
      >
        {backfillLoading ? "Backfilling..." : "Backfill Old Activities"}
      </button>

      {/* Search Box */}
      <input
        type="text"
        placeholder="Search by user, entity or description..."
        className="border p-2 mb-4 w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">User</th>
              <th className="border p-2">Action</th>
              <th className="border p-2">Entity</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  No activities found
                </td>
              </tr>
            ) : (
              activities.map((a) => (
                <tr key={a.id} className="hover:bg-gray-100">
                  <td className="border p-2">{a.userName}</td>
                  <td className="border p-2">{a.action}</td>
                  <td className="border p-2">{a.entity}</td>
                  <td className="border p-2">{a.description || "-"}</td>
                  <td className="border p-2">
                    {new Date(a.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="mt-4 flex justify-center gap-2">
        <button
          className="border px-3 py-1 rounded disabled:opacity-50"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>
        <span className="px-3 py-1">{page}</span>
        <button
          className="border px-3 py-1 rounded disabled:opacity-50"
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
