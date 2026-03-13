import { Badge } from "@/components/ui/Badge";
import { AppLink } from "@/components/ui/AppLink";
import styles from "./Hero.module.css";

const DEFAULT_IMAGE = "/images/branding/hero.jpg";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.left}>
        <div className={styles.badges}>
          <Badge color="accent">Regulated</Badge>
          <Badge color="accent">Tokenized</Badge>
        </div>
        <h2 className={styles.title}>
          Access premium real estate opportunities
        </h2>
        <p className={styles.text}>
          Build long-term exposure with transparent listings, structured assets
          and investor-first checkout flow.
        </p>
        <div className={styles.actions}>
          <AppLink href="/listings" looksLikeButton>
            Explore Listings
          </AppLink>
          <AppLink href="/register">Create Account</AppLink>
        </div>
      </div>
      <div className={styles.imageWrap}>
        <img
          src={DEFAULT_IMAGE}
          alt="Real estate building"
          className={styles.image}
        />
      </div>
    </section>
  );
}
