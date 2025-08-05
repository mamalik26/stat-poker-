import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Trash2, RotateCcw, Loader2, Users, Settings } from 'lucide-react';
import CardSelector from './CardSelector';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../mock';

const PlayingCardDisplay = ({ card, onRemove, position, disabled }) => {
  if (!card) return null;

  return (
    <div className="relative group">
      <div className={`
        w-16 h-20 bg-gradient-to-br from-white via-gray-50 to-gray-100 
        border-2 border-gray-300 rounded-xl shadow-lg 
        flex flex-col items-center justify-center font-bold text-sm
        transition-all duration-300 ease-in-out
        hover:shadow-2xl hover:-translate-y-2 hover:scale-105
        ${SUIT_COLORS[card.suit]}
        ${disabled ? 'opacity-60' : 'cursor-pointer'}
        backdrop-blur-sm
      `}>
        <span className="text-lg font-black drop-shadow-sm">{card.rank}</span>
        <span className="text-xl drop-shadow-sm">{SUIT_SYMBOLS[card.suit]}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-xl"></div>
      </div>
      {!disabled && (
        <Button
          variant="destructive"
          size="sm"
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
          onClick={() => onRemove(position)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

const PokerTable = ({ onCardsChange, onPlayersChange, isLoading }) => {
  const [holeCards, setHoleCards] = useState([null, null]);
  const [communityCards, setCommunityCards] = useState([null, null, null, null, null]);
  const [playerCount, setPlayerCount] = useState(2);

  const allSelectedCards = [...holeCards.filter(Boolean), ...communityCards.filter(Boolean)];

  const handleHoleCardSelect = (card, position) => {
    console.log('Hole card selected:', card, 'at position:', position);
    console.log('Current holeCards state:', holeCards);
    const newHoleCards = [...holeCards];
    newHoleCards[position] = card;
    console.log('New holeCards after setting position', position, ':', newHoleCards);
    setHoleCards(newHoleCards);
    console.log('Calling onCardsChange with:', newHoleCards, communityCards);
    onCardsChange(newHoleCards, communityCards);
  };

  const createHoleCardSelector = (position) => {
    return (selectedCard) => {
      console.log('Hole card selector called for position:', position, 'with card:', selectedCard);
      handleHoleCardSelect(selectedCard, position);
    };
  };

  const handleCommunityCardSelect = (card, position) => {
    console.log('Community card selected:', card, 'at position:', position);
    const newCommunityCards = [...communityCards];
    newCommunityCards[position] = card;
    setCommunityCards(newCommunityCards);
    console.log('Calling onCardsChange with:', holeCards, newCommunityCards);
    onCardsChange(holeCards, newCommunityCards);
  };

  const removeCard = (type, position) => {
    console.log('Removing card:', type, 'at position:', position);
    if (type === 'hole') {
      const newHoleCards = [...holeCards];
      newHoleCards[position] = null;
      setHoleCards(newHoleCards);
      console.log('Calling onCardsChange after hole card removal:', newHoleCards, communityCards);
      onCardsChange(newHoleCards, communityCards);
    } else {
      const newCommunityCards = [...communityCards];
      newCommunityCards[position] = null;
      setCommunityCards(newCommunityCards);
      console.log('Calling onCardsChange after community card removal:', holeCards, newCommunityCards);
      onCardsChange(holeCards, newCommunityCards);
    }
  };

  const clearAll = () => {
    const emptyHole = [null, null];
    const emptyCommunity = [null, null, null, null, null];
    setHoleCards(emptyHole);
    setCommunityCards(emptyCommunity);
    console.log('Calling onCardsChange after clear all:', emptyHole, emptyCommunity);
    onCardsChange(emptyHole, emptyCommunity);
  };

  const handlePlayerCountChange = (count) => {
    setPlayerCount(count);
    onPlayersChange(count);
  };

  return (
    <div className="w-full relative">
      {/* Removed loading overlay from here since it's now handled by the Calculate button */}
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0F3D2E] to-[#1B5E47] px-8 py-6 rounded-t-3xl">
        <div className="text-center">
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-4 tracking-tight">
            🎲 Virtual Poker Table
          </h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm rounded-2xl px-6 py-3 border border-emerald-400/30">
              <Users className="w-5 h-5 text-emerald-300" />
              <Label className="text-emerald-200 font-medium">Players:</Label>
              <Input
                type="number"
                min="2"
                max="10"
                value={playerCount}
                onChange={(e) => handlePlayerCountChange(parseInt(e.target.value))}
                className="w-16 bg-white/90 border-2 border-emerald-300/20 rounded-xl font-semibold text-center text-gray-800 focus:border-emerald-400 focus:ring-emerald-400/20"
                disabled={false}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={clearAll} 
              className="bg-white/10 hover:bg-white/20 border-emerald-300/30 text-white hover:text-white rounded-2xl px-6 py-3 font-medium transition-all duration-300 backdrop-blur-sm"
              disabled={false}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </div>
      
      {/* Felt Table Surface */}
      <div className="bg-gradient-to-br from-[#0F3D2E] via-[#1B5E47] to-[#0F3D2E] px-8 py-10 space-y-10 rounded-b-3xl">
        {/* Your Hole Cards */}
        <div className="text-center">
          <div className="mb-6">
            <h3 className="text-white text-xl font-semibold mb-2 tracking-wide">Your Hole Cards</h3>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full mx-auto opacity-70"></div>
          </div>
          <div className="flex justify-center gap-6">
            {holeCards.map((card, index) => {
              console.log('Rendering hole card at index:', index, 'card:', card);
              return (
                <div key={`hole-${index}`} className="relative" data-card-index={index}>
                  {card ? (
                    <PlayingCardDisplay 
                      card={card} 
                      onRemove={() => removeCard('hole', index)}
                      position={index}
                      disabled={false}
                    />
                  ) : (
                    <div className="group">
                      <CardSelector
                        selectedCards={allSelectedCards}
                        onCardSelect={createHoleCardSelector(index)}
                        title={`Select Hole Card ${index + 1}`}
                        disabled={false}
                        cardPosition={index}
                      />
                    </div>
                  )}
                  <div className="mt-3 text-center">
                    <span className="text-emerald-200 text-sm font-medium opacity-75">
                      Card {index + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Community Cards */}
        <div className="text-center space-y-8">
          <div>
            <h3 className="text-white text-xl font-semibold mb-2 tracking-wide">Community Cards</h3>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto opacity-70"></div>
          </div>
          
          {/* Flop */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
              <h4 className="text-emerald-200 text-lg font-semibold px-4 py-1 bg-black/20 rounded-xl backdrop-blur-sm border border-emerald-400/30">
                Flop
              </h4>
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
            </div>
            <div className="flex justify-center gap-3">
              {communityCards.slice(0, 3).map((card, index) => (
                <div key={`flop-${index}`} className="relative">
                  {card ? (
                    <PlayingCardDisplay 
                      card={card} 
                      onRemove={(pos) => removeCard('community', pos)}
                      position={index}
                      disabled={false}
                    />
                  ) : (
                    <CardSelector
                      selectedCards={allSelectedCards}
                      onCardSelect={(selectedCard) => handleCommunityCardSelect(selectedCard, index)}
                      title={`Select Flop Card ${index + 1}`}
                      disabled={index > 0 && !communityCards[index - 1]}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Turn */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
              <h4 className="text-blue-200 text-lg font-semibold px-4 py-1 bg-black/20 rounded-xl backdrop-blur-sm border border-blue-400/30">
                Turn
              </h4>
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
            </div>
            <div className="flex justify-center">
              {communityCards[3] ? (
                <PlayingCardDisplay 
                  card={communityCards[3]} 
                  onRemove={(pos) => removeCard('community', pos)}
                  position={3}
                  disabled={false}
                />
              ) : (
                <CardSelector
                  selectedCards={allSelectedCards}
                  onCardSelect={(selectedCard) => handleCommunityCardSelect(selectedCard, 3)}
                  title="Select Turn Card"
                  disabled={!communityCards[2]}
                />
              )}
            </div>
          </div>

          {/* River */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
              <h4 className="text-purple-200 text-lg font-semibold px-4 py-1 bg-black/20 rounded-xl backdrop-blur-sm border border-purple-400/30">
                River
              </h4>
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
            </div>
            <div className="flex justify-center">
              {communityCards[4] ? (
                <PlayingCardDisplay 
                  card={communityCards[4]} 
                  onRemove={(pos) => removeCard('community', pos)}
                  position={4}
                  disabled={false}
                />
              ) : (
                <CardSelector
                  selectedCards={allSelectedCards}
                  onCardSelect={(selectedCard) => handleCommunityCardSelect(selectedCard, 4)}
                  title="Select River Card"
                  disabled={!communityCards[3]}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokerTable;