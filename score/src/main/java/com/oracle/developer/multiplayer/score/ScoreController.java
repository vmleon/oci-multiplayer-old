package com.oracle.developer.multiplayer.score;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ScoreController {
    Logger logger = LoggerFactory.getLogger(ScoreController.class);

    @GetMapping("/api/score")
    String getScore() {
        return "scores";
    }
}
