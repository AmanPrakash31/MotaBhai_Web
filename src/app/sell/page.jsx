
import SellForm from './SellForm';

export default function SellPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Sell Your Motorcycle</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Fill out the form below to list your bike on our platform. Our AI tool can help you find the right price.
        </p>
      </div>
      <SellForm />
    </div>
  );
}
