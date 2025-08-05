#!/usr/bin/env python3
"""
Script pour créer un compte modérateur avec accès complet aux fonctionnalités premium.
"""

import asyncio
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration de chiffrement des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuration MongoDB
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'poker_calculator')

async def create_moderator_account():
    """Créer un nouveau compte modérateur"""
    
    # Connexion MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Informations du nouveau compte modérateur
        moderator_data = {
            "id": str(uuid.uuid4()),
            "name": "Modérateur Premium",
            "email": "moderator.premium@pokerpro.com",
            "hashed_password": pwd_context.hash("PokerPremiumMod2024!"),
            "subscription_status": "active",  # Abonnement actif pour l'accès complet
            "subscription_id": f"mod_premium_{datetime.now().strftime('%Y%m%d')}",
            "role": "moderator",  # Rôle modérateur avec privilèges étendus
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Vérifier si l'email existe déjà
        existing_user = await db.users.find_one({"email": moderator_data["email"]})
        if existing_user:
            print(f"⚠️  Un utilisateur avec l'email {moderator_data['email']} existe déjà.")
            
            # Mettre à jour l'utilisateur existant avec les privilèges modérateur
            update_result = await db.users.update_one(
                {"email": moderator_data["email"]},
                {"$set": {
                    "role": "moderator",
                    "subscription_status": "active",
                    "subscription_id": moderator_data["subscription_id"],
                    "updated_at": datetime.utcnow()
                }}
            )
            
            if update_result.modified_count > 0:
                print("✅ Compte existant mis à jour avec les privilèges modérateur premium.")
                print(f"📧 Email: {moderator_data['email']}")
                print("🔑 Mot de passe: (inchangé - utilisez le mot de passe existant)")
            else:
                print("❌ Erreur lors de la mise à jour du compte existant.")
                return False
        else:
            # Créer un nouveau compte modérateur
            insert_result = await db.users.insert_one(moderator_data)
            
            if insert_result.inserted_id:
                print("✅ Nouveau compte modérateur créé avec succès!")
                print(f"📧 Email: {moderator_data['email']}")
                print(f"🔑 Mot de passe: PokerPremiumMod2024!")
                print(f"👑 Rôle: {moderator_data['role']}")
                print(f"💎 Statut d'abonnement: {moderator_data['subscription_status']}")
            else:
                print("❌ Erreur lors de la création du compte modérateur.")
                return False
        
        # Vérifier les privilèges d'accès
        print("\n🎯 Privilèges accordés:")
        print("   ✓ Accès complet au calculateur de probabilités")
        print("   ✓ Contournement des restrictions d'abonnement")
        print("   ✓ Accès à toutes les fonctionnalités premium")
        print("   ✓ Simulations Monte Carlo illimitées (100k+ itérations)")
        print("   ✓ Analyse avancée des mains de poker")
        print("   ✓ Recommandations stratégiques détaillées")
        print("   ✓ Historique des analyses complet")
        
        # Afficher les informations de connexion
        print("\n🔐 Informations de connexion:")
        print(f"   URL: {os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000')}/login")
        print(f"   Email: {moderator_data['email']}")
        print("   Mot de passe: PokerPremiumMod2024!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la création du compte modérateur: {e}")
        return False
    finally:
        client.close()

async def verify_moderator_access():
    """Vérifier que le compte modérateur a bien accès à toutes les fonctionnalités"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Récupérer le compte modérateur
        moderator = await db.users.find_one({"email": "moderator.premium@pokerpro.com"})
        
        if not moderator:
            print("❌ Compte modérateur non trouvé.")
            return False
        
        print("\n🔍 Vérification des privilèges:")
        print(f"   👤 Nom: {moderator['name']}")
        print(f"   📧 Email: {moderator['email']}")
        print(f"   👑 Rôle: {moderator['role']}")
        print(f"   💎 Statut d'abonnement: {moderator['subscription_status']}")
        
        # Vérifier que le rôle est modérateur
        if moderator['role'] != 'moderator':
            print("   ❌ Rôle incorrect - doit être 'moderator'")
            return False
        
        # Vérifier que l'abonnement est actif (pour l'accès premium)
        if moderator['subscription_status'] != 'active':
            print("   ❌ Statut d'abonnement incorrect - doit être 'active'")
            return False
        
        print("   ✅ Tous les privilèges sont correctement configurés!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la vérification: {e}")
        return False
    finally:
        client.close()

async def main():
    """Fonction principale"""
    print("🚀 Création d'un compte modérateur premium pour Poker Pro Calculator")
    print("=" * 70)
    
    # Créer le compte modérateur
    success = await create_moderator_account()
    
    if success:
        # Vérifier les privilèges
        await verify_moderator_access()
        
        print("\n" + "=" * 70)
        print("✅ SUCCÈS - Compte modérateur premium créé et configuré!")
        print("\n💡 Instructions d'utilisation:")
        print("   1. Connectez-vous avec les identifiants fournis ci-dessus")
        print("   2. Accédez au calculateur via le menu 'Calculateur'")
        print("   3. Profitez de l'accès complet à toutes les fonctionnalités premium")
        print("\n🔐 En tant que modérateur, vous bénéficiez:")
        print("   • Accès immédiat sans restriction d'abonnement")
        print("   • Toutes les fonctionnalités premium débloquées")
        print("   • Simulations Monte Carlo haute performance")
        print("   • Interface complète d'analyse de mains")
        
    else:
        print("\n❌ Échec de la création du compte modérateur.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())