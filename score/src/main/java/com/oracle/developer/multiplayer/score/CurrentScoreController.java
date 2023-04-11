package com.oracle.developer.multiplayer.score;

import com.oracle.developer.multiplayer.score.dao.CurrentScoreDAO;
import com.oracle.developer.multiplayer.score.dao.ScoreOperationDAO;
import com.oracle.developer.multiplayer.score.data.CurrentScore;
import com.oracle.developer.multiplayer.score.data.Score;
import com.oracle.developer.multiplayer.score.repository.CurrentScoreRepository;
import com.oracle.developer.multiplayer.score.repository.ScoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.transaction.Transactional;

@RestController
public class CurrentScoreController {
    Logger logger = LoggerFactory.getLogger(CurrentScoreController.class);

    private final CurrentScoreRepository currentScoreRepository;

    private final ScoreRepository scoreRepository;

    public CurrentScoreController(CurrentScoreRepository currentScoreRepository, ScoreRepository scoreRepository) {
        this.currentScoreRepository = currentScoreRepository;
        this.scoreRepository = scoreRepository;
    }

    @GetMapping("/api/score/{uuid}")
    CurrentScoreDAO getByUuid(@PathVariable("uuid") String uuid) {
        logger.info("GET /api/score/" + uuid);
        CurrentScore score = currentScoreRepository.findByUuid(uuid).orElseThrow(() -> new NotAuthorizedOrNotFound());
        return new CurrentScoreDAO(score.getUuid(),score.getName(), score.getScore() );
    }

    @PutMapping("/api/score/{uuid}")
    CurrentScoreDAO addScore(@PathVariable("uuid") String uuid, @RequestBody ScoreOperationDAO body) {
        logger.info("PUT /api/score/" + uuid);
        CurrentScore scoreFromStore = currentScoreRepository.findByUuid(uuid)
                .orElse(new CurrentScore());
        Long deltaScore;
        switch (body.getOperationType()) {
            case DECREMENT:
                deltaScore = - 1L;
                break;
            case INCREMENT:
                deltaScore = 1L;
                break;
            default:
                deltaScore = 0L;
                break;
        }
        Long newScoreValue = scoreFromStore.getScore() + deltaScore;
        if (newScoreValue > scoreFromStore.getScore()) {
            scoreFromStore.setScore(newScoreValue);
            scoreFromStore.setName(body.getName());
            scoreFromStore.setUuid(uuid);
            CurrentScore saved = currentScoreRepository.save(scoreFromStore);
            return new CurrentScoreDAO(saved.getUuid(),saved.getName(), saved.getScore() );
        }
        return new CurrentScoreDAO(scoreFromStore.getUuid(),scoreFromStore.getName(), scoreFromStore.getScore() );
    }

    @DeleteMapping("/api/score/{uuid}")
    @Transactional
    ResponseEntity<Void> deleteByUuid(@PathVariable("uuid") String uuid) {
        logger.info("DELETE /api/score/" + uuid);
        CurrentScore currentScoreFromStore =
                currentScoreRepository.findByUuid(uuid).orElseThrow(() -> new NotAuthorizedOrNotFound());
        Score scoreFromStore = scoreRepository.findByUuid(uuid).orElse(new Score(uuid,
                currentScoreFromStore.getName(), 0L));
        if (currentScoreFromStore.getScore() > scoreFromStore.getScore()) {
            scoreFromStore.setScore(currentScoreFromStore.getScore());
            scoreFromStore.setName(currentScoreFromStore.getName());
            scoreRepository.save(scoreFromStore);
        }
        currentScoreRepository.delete(currentScoreFromStore);
        return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
    }

    @DeleteMapping("/api/score")
    ResponseEntity<Void> deleteAll() {
        logger.info("DELETE /api/score");
        currentScoreRepository.deleteAll();
        return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
    }

}
