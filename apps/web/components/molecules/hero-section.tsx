import { Container } from "../atoms/container";
import { Heading } from "../atoms/heading";

export function HeroSection() {
  return (
    <section className="bg-linear-to-b from-white to-teal-50 py-20 md:py-32">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <Heading as="h1" size="6xl" className="mb-6">
            The Open Source Headless CMS
          </Heading>
        </div>
      </Container>
    </section>
  );
}
