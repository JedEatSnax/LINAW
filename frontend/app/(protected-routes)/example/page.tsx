import { columns, type Payment } from "@/columns/example";
import { DataTable } from "@/components/data-table";

async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "PRD-201",
      productName: "Atlas Phone X",
      price: 699,
      availability: "In Stock",
    },
    {
      id: "PRD-202",
      productName: "North Headphones",
      price: 242,
      availability: "In Stock",
    },
    {
      id: "PRD-203",
      productName: "Pulse Tablet Air",
      price: 655,
      availability: "Limited",
    },
    {
      id: "PRD-204",
      productName: "Studio Display 24",
      price: 874,
      availability: "In Stock",
    },
    {
      id: "PRD-205",
      productName: "Mono Charging Dock",
      price: 541,
      availability: "Out of Stock",
    },
    {
      id: "PRD-206",
      productName: "Trail Smartwatch",
      price: 319,
      availability: "Limited",
    },
    {
      id: "PRD-207",
      productName: "Luma Keyboard",
      price: 189,
      availability: "In Stock",
    },
    {
      id: "PRD-208",
      productName: "Vector Camera Mini",
      price: 999,
      availability: "Out of Stock",
    },
    {
      id: "PRD-209",
      productName: "Glass Speaker One",
      price: 420,
      availability: "Limited",
    },
    {
      id: "PRD-210",
      productName: "Orbit Mouse",
      price: 129,
      availability: "In Stock",
    },
    {
      id: "PRD-211",
      productName: "Signal Router Max",
      price: 349,
      availability: "Limited",
    },
    {
      id: "PRD-212",
      productName: "Core Laptop Stand",
      price: 79,
      availability: "In Stock",
    },
    // ...
  ];
}

export default async function ExamplePage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
