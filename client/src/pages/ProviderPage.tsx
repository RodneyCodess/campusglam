import { useParams } from "react-router";

export default function ProviderPage() {
  // The :id part of /providers/:id
  const { id } = useParams();

  return (
    <>
      <h1>Provider {id}</h1>
      <p>Placeholder: this provider's profile, services and reviews.</p>
    </>
  );
}
