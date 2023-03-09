package com.oracle.developer.multiplayer.score.data;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Entity
@ToString
@EqualsAndHashCode
public class Score {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Getter
    Long id;

    @Getter
    @Setter
    String uuid;

    @Getter
    @Setter
    String name;

    @Getter
    @Setter
    Long score;

    public Score() {
        this.uuid = "";
        this.name = "";
        this.score = 0L;
    }

    public Score(String uuid, String name, Long score) {
        this.uuid = uuid;
        this.name = name;
        this.score = score;
    }
}
