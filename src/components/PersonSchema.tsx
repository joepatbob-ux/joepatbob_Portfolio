export function PersonSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Joseph Patrick Roberts',
    url: 'https://joepatbob.com',
    jobTitle: 'Principal Product Designer',
    sameAs: [
      'https://www.linkedin.com/in/joepatbob/',
      'https://patents.google.com/patent/US12608066',
    ],
    image: 'https://joepatbob.com/images/PortraitLight_MG_3496-optimized.jpg',
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
