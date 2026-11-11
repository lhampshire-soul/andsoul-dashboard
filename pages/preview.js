// The simplified dashboard is now the main page — keep old /preview links working.
export async function getServerSideProps() {
  return { redirect: { destination: "/", permanent: false } };
}
export default function Preview() { return null; }
