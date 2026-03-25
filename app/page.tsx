import { Hero } from "@/components/sections/Hero";
import { PhotoCta } from "@/components/sections/PhotoCta";
import { getHomepageCtas } from "@/src/presentation/composition/server";

export default async function Home() {
  const { ctaOne, ctaTwo } = await getHomepageCtas();

  return (
    <div className="vertical-stack-with-gap">
      <Hero />
      {ctaOne ? (
        <PhotoCta
          title={ctaOne.title}
          text={ctaOne.text}
          href={ctaOne.href}
          image={ctaOne.image}
        />
      ) : null}
      {ctaTwo ? (
        <PhotoCta
          title={ctaTwo.title}
          text={ctaTwo.text}
          href={ctaTwo.href}
          image={ctaTwo.image}
          reverse
        />
      ) : null}
    </div>
  );
}
