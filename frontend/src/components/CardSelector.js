import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { generateDeck, SUIT_SYMBOLS, SUIT_COLORS } from '../mock';
import { Plus, Search, X } from 'lucide-react';

const PlayingCard = ({ card, isSelected, onSelect, disabled }) => {
  return (
    <button
      className={`
        w-12 h-16 p-1 text-xs font-bold border-2 rounded-lg transition-all duration-200 
        bg-gradient-to-br from-white via-gray-50 to-gray-100
        ${isSelected 
          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/25 scale-105' 
          : disabled
            ? 'border-gray-300 opacity-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-emerald-400/70 hover:shadow-md hover:scale-105 cursor-pointer hover:bg-emerald-50/20'
        }
        ${card ? SUIT_COLORS[card.suit] : 'text-gray-600'}
        focus:outline-none focus:ring-2 focus:ring-emerald-500/50
        disabled:pointer-events-none
      `}
      onClick={() => !disabled && onSelect(card)}
      disabled={disabled}
    >
      {card && (
        <div className="flex flex-col items-center justify-center h-full">
          <span className="font-bold text-sm leading-none">{card.rank}</span>
          <span className="text-lg leading-none mt-0.5">{SUIT_SYMBOLS[card.suit]}</span>
        </div>
      )}
    </button>
  );
};

const CardSelector = ({ selectedCards, onCardSelect, title, disabled = false, cardPosition }) => {
  console.log('CardSelector rendered with position:', cardPosition);
  const [isOpen, setIsOpen] = useState(false);
  const deck = generateDeck();
  
  const handleCardSelect = (card) => {
    console.log('CardSelector handleCardSelect called with card:', card, 'for position:', cardPosition);
    console.log('CardSelector onCardSelect function:', onCardSelect);
    onCardSelect(card);
    setIsOpen(false);
  };

  const isCardDisabled = (card) => {
    return selectedCards.some(selected => 
      selected && selected.id === card.id
    );
  };

  // Organise les cartes par rang pour un affichage en colonnes
  const cardsByRank = {};
  deck.forEach(card => {
    if (!cardsByRank[card.rank]) {
      cardsByRank[card.rank] = [];
    }
    cardsByRank[card.rank].push(card);
  });

  const rankOrder = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suitOrder = ['spades', 'hearts', 'diamonds', 'clubs'];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`
            h-20 w-16 border-2 border-dashed rounded-xl transition-all duration-300
            ${disabled 
              ? 'border-gray-600 cursor-not-allowed opacity-50' 
              : 'border-gray-400 hover:border-emerald-400 hover:bg-emerald-500/5 hover:scale-105'
            }
            bg-black/10 backdrop-blur-sm hover:shadow-lg hover:shadow-emerald-500/10
            focus:outline-none focus:ring-2 focus:ring-emerald-500/50
          `}
          disabled={disabled}
        >
          <div className="flex flex-col items-center gap-1">
            <Plus className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Add</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] border border-gray-700/50 rounded-2xl">
        <DialogHeader className="pb-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-100 flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" />
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-400 mt-1">Sélectionnez une carte pour continuer</p>
        </DialogHeader>
        
        {/* Grille compacte des cartes */}
        <div className="p-4 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <div className="space-y-4">
            {rankOrder.map(rank => (
              <div key={rank} className="group">
                {/* En-tête de rang */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-base">{rank}</span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-gray-600 via-gray-500 to-transparent flex-1"></div>
                  <div className="text-xs text-gray-500 font-medium px-2">
                    {rank === 'A' ? 'As' : rank === 'K' ? 'Roi' : rank === 'Q' ? 'Dame' : rank === 'J' ? 'Valet' : rank}
                  </div>
                </div>
                
                {/* Cartes de ce rang en ligne (4 couleurs) */}
                <div className="grid grid-cols-4 gap-3 pl-2 justify-items-center">
                  {suitOrder.map(suit => {
                    const card = cardsByRank[rank]?.find(c => c.suit === suit);
                    return card ? (
                      <PlayingCard
                        key={card.id}
                        card={card}
                        onSelect={handleCardSelect}
                        disabled={isCardDisabled(card)}
                        isSelected={false}
                      />
                    ) : (
                      <div key={`${rank}-${suit}-empty`} className="w-12 h-16 opacity-20"></div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* Légende des couleurs */}
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="bg-gray-800/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-3 text-center">Couleurs</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-xl text-gray-900">♠</span>
                  <span className="text-gray-400">Piques</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-xl text-red-600">♥</span>
                  <span className="text-gray-400">Cœurs</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-xl text-red-600">♦</span>
                  <span className="text-gray-400">Carreaux</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-xl text-gray-900">♣</span>
                  <span className="text-gray-400">Trèfles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardSelector;