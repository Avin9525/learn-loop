import { Progress } from '@/types/types';
import { appwrite } from '@/lib/appwrite';

export const progressService = {

    calcAndUpdateProgress: async (progress:Progress[], questionId:string|null, isCorrect:boolean) => {
        if(questionId == null) return;

        const progressItem = progress.find(item => item.questionId === questionId);
        const newProgressItem:Progress    = {} as Progress;
        if(progressItem) {
            newProgressItem.correctCount = progressItem.correctCount;
            newProgressItem.wrongCount = progressItem.wrongCount;
            if(isCorrect) {
            newProgressItem.correctCount++
            } else {
            newProgressItem.wrongCount++
            }
            console.log(newProgressItem.correctCount, newProgressItem.wrongCount);
            newProgressItem.longTermScore =Math.trunc(( newProgressItem.correctCount * 100) / (newProgressItem.correctCount + newProgressItem.wrongCount));
            console.log(newProgressItem.longTermScore);
            newProgressItem.middleTermScore = progressService.middleTermScoreCalc(progressItem.middleTermScore, isCorrect);
            newProgressItem.shortTermScore = progressService.shortTermScoreCalc(progressItem.shortTermScore, isCorrect);
            newProgressItem.easyRating = Math.trunc((newProgressItem.longTermScore*0.25) + (newProgressItem.middleTermScore*0.35) + (newProgressItem.shortTermScore*0.40))
            newProgressItem.totalAttempts = progressService.totalAttemptsCalc(progressItem.easyRating, progressItem.totalAttempts);
           try{
            await appwrite.updateProgress(progressItem.$id, newProgressItem);
           } catch (error) {
            console.log(error); 
           }
        } else {
            console.log("Progress item not found");

        }
    },


   
    middleTermScoreCalc: (score:number, isCorrect:boolean) => {
        if(score <= 0) {
            if(isCorrect) {
                return 10;
            } else {
                return 0;
            }

        } else if(score >= 100) {
            if(isCorrect) {
                return 100;
            } else {
                return 90;
            }
        } else {
            if(isCorrect) {
                return score + 10;
            } else {
                return score - 10;
            }
        }
    
    },

    shortTermScoreCalc: (score:number, isCorrect:boolean) => {
        let newScore  = 0;
        if(score <= 0) {
            if(isCorrect) {
                newScore= 30;
            } else {
                newScore = 0;
            }

        } else if(score >= 100) {
            if(isCorrect) {
                newScore = 100;
            } else {
                newScore = 70;
            }
        } else {
            if(isCorrect) {
                newScore = score + 30
            } else {
                newScore = score - 30;
            }
        }
        if(newScore < 0) {
            return 0;
        } else if(newScore > 100) {
            return 100;
        } else {
            return newScore;
        }
    
    }, 

    totalAttemptsCalc:(easyRating:number,totalAttempts:number) => {
        if(totalAttempts<=10) {
            return totalAttempts + 1;
        } else {
            return totalAttempts + Math.trunc(easyRating/10);
        }
    }


}