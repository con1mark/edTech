export default function InstructorDashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Overview 📊</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition">
          <h3 className="font-semibold text-lg">Courses</h3>
          <p className="text-gray-600 mt-2">You have 4 active courses.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition">
          <h3 className="font-semibold text-lg">Students</h3>
          <p className="text-gray-600 mt-2">120 enrolled students.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition">
          <h3 className="font-semibold text-lg">Earnings</h3>
          <p className="text-gray-600 mt-2">$2,340 earned this month.</p>
        </div>
      </div>
    </div>
  );
}
