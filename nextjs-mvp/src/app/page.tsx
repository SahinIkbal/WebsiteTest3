import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">School SaaS MVP</h1>
      <p className="mb-2">A simple platform for local schools in West Bengal.</p>
      <ul className="list-disc pl-6">
        <li>Online attendance tracking</li>
        <li>Student report management</li>
        <li>Parent-teacher communication</li>
      </ul>
      <div className="mt-4">
        <Link href="/login" className="text-blue-600 underline">Login</Link>
      </div>
    </main>
  );
}
