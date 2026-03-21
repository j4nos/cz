"use client";

import { Hero } from "@/components/sections/Hero";
import { PhotoCta } from "@/components/sections/PhotoCta";
import { PlainCta } from "@/components/sections/PlainCta";
import { AppLink } from "@/components/ui/AppLink";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Carousel } from "@/components/ui/Carousel";
import {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/ui/Form";
import { Table } from "@/components/ui/Table";

import styles from "./page.module.css";

const carouselImages = [
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1560185008-a33f8c76f73a?auto=format&fit=crop&w=1200&q=80",
];

const tableRows = [
  ["Urban Rental Block", "Open", "EUR 145,000"],
  ["Green Family Residence", "Pending", "EUR 88,000"],
  ["Riverfront Offices", "Closed", "EUR 215,000"],
];

export default function UiCatalogPage() {
  return (
    <div className="vertical-stack-with-gap">
      <header className={styles.header}>
        <h1>UI Catalog</h1>
        <p>Reusable components following the requested minimalist style.</p>
      </header>

      <>
        <article className={styles.block}>
          <h2>Button + Link + Badge</h2>
          <div className="horizontal-stack">
            <Button>Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <AppLink href="/listings">Text Link</AppLink>
            <AppLink href="/investor" looksLikeButton>
              Button Link
            </AppLink>
            <Badge>Badge</Badge>
          </div>
        </article>

        <article className={styles.block}>
          <h2>Toast controls</h2>
        </article>
      </>

      <>
        <article className={styles.block}>
          <h2>Carousel</h2>
          <Carousel images={carouselImages} altPrefix="Property" />
        </article>

        <article className={styles.block}>
          <h2>Card</h2>
          <Card
            title="Verified listing"
            body="Each listing includes due diligence notes and transparent pricing model."
            cta={<AppLink href="/listings/123">Details</AppLink>}
          />
        </article>
      </>

      <>
        <h2>Table</h2>
        <Table headers={["Listing", "Status", "Target"]} rows={tableRows} />
      </>

      <>
        <h2>Form</h2>
        <Form onSubmit={(event) => event.preventDefault()}>
          <FormField label="Full name" htmlFor="catalog-name">
            <FormInput
              id="catalog-name"
              name="name"
              placeholder="Jane Investor"
            />
          </FormField>

          <FormField label="Email" htmlFor="catalog-email">
            <FormInput
              id="catalog-email"
              name="email"
              type="email"
              placeholder="jane@cityzeen.com"
            />
          </FormField>

          <FormField label="Role" htmlFor="catalog-role">
            <FormSelect
              id="catalog-role"
              name="role"
              options={[
                { value: "investor", label: "Investor" },
                { value: "asset-provider", label: "Asset Provider" },
                { value: "advisor", label: "Advisor" },
              ]}
            />
          </FormField>

          <FormField label="Message" htmlFor="catalog-message">
            <FormTextarea
              id="catalog-message"
              name="message"
              placeholder="Share your interest in a listing."
            />
          </FormField>

          <Button type="submit">Submit</Button>
        </Form>
      </>

      <>
        <h2>Hero</h2>
        <Hero />
      </>

      <>
        <h2>PhotoCta</h2>
        <div className={styles.stack}>
          <PhotoCta
            title="Investment-ready residential unit"
            text="Investor pack available with legal summary and projected yield scenarios."
            href="/listings/cta-1"
          />
          <PhotoCta
            title="Reverse variant"
            text="Same component with reversed media/content order for visual rhythm."
            href="/listings/cta-2"
            reverse
          />
        </div>
      </>

      <>
        <h2>PlainCta</h2>
        <PlainCta
          title="Create a new asset"
          text="Use this section to highlight high-priority operations like onboarding a new property."
          actionLabel="Create Asset"
          href="/asset-provider/assets/new/step-1"
        />
      </>
    </div>
  );
}
