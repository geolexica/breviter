import Link from 'next/link';

export default function Main() {
  return (
    <>
      <p>
        <Link href="/reverse">
          <a>Reverse search demo</a>
        </Link>
      </p>
      <p>
        <Link href="/testing">
          <a>Experiment</a>
        </Link>
      </p>
    </>
  );
}
