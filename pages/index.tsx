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
          <a>Bulk search and reporting</a>
        </Link>
      </p>
      <p>
        <Link href="/list">
          <a>Filter loaded entries</a>
        </Link>
      </p>
      <p>
        <Link href="/readdb">
          <a>Show loaded database in delimited format</a>
        </Link>
      </p>
    </>
  );
}
