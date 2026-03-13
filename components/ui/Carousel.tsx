"use client";

import { useState } from "react";

import { Button } from "./Button";
import styles from "./Carousel.module.css";

type CarouselProps = {
  images: string[];
  altPrefix?: string;
};

export function Carousel({ images, altPrefix = "Slide" }: CarouselProps) {
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0;

  if (!hasImages) {
    return <div className={styles.empty}>No images</div>;
  }

  const prev = () =>
    setActive((current) => (current === 0 ? images.length - 1 : current - 1));
  const next = () =>
    setActive((current) => (current === images.length - 1 ? 0 : current + 1));

  return (
    <section className={styles.carousel}>
      <div className={styles.imageWrap}>
        <img
          src={images[active]}
          alt={`${altPrefix} ${active + 1}`}
          className={styles.image}
        />
      </div>
      <div className={styles.controls}>
        <Button variant="ghost" onClick={prev} type="button">
          Prev
        </Button>
        <span className={styles.counter}>
          {active + 1}/{images.length}
        </span>
        <Button variant="ghost" onClick={next} type="button">
          Next
        </Button>
      </div>
    </section>
  );
}
