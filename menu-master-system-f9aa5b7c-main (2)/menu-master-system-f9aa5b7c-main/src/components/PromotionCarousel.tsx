
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { promotions } from '@/data/menu';
import { Promotion } from '@/types';

const PromotionCarousel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePromotionClick = (url: string, title: string) => {
    if (url.startsWith('/')) {
      navigate(url);
    } else {
      // Se não for uma URL interna, abrimos em uma nova aba ou mostramos um toast
      toast({
        title: `Promoção: ${title}`,
        description: "Clique para mais detalhes sobre esta oferta.",
      });
    }
  };

  // Filter active promotions (if active property exists and is not false)
  const activePromotions = promotions.filter((promo: Promotion) => promo.active !== false);

  return (
    <div className="w-full py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Promoções e Eventos</h2>
      </div>

      <Carousel className="w-full">
        <CarouselContent>
          {activePromotions.map((promo) => (
            <CarouselItem key={promo.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card className="overflow-hidden border-none shadow-lg">
                  <div className="relative">
                    <img 
                      src={promo.image} 
                      alt={promo.title} 
                      className="w-full h-40 object-cover"
                    />
                    <Badge 
                      className="absolute top-2 right-2 bg-restaurant-primary text-white"
                    >
                      {promo.badgeText}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-1">{promo.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{promo.description}</p>
                    <Button 
                      size="sm" 
                      className="w-full bg-restaurant-primary hover:bg-restaurant-primary/90"
                      onClick={() => handlePromotionClick(promo.url, promo.title)}
                    >
                      {promo.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 -translate-x-1/2" />
        <CarouselNext className="right-0 translate-x-1/2" />
      </Carousel>
    </div>
  );
};

export default PromotionCarousel;
