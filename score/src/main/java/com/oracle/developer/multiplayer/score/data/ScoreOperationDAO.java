package com.oracle.developer.multiplayer.score.data;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@ToString
@EqualsAndHashCode
public class ScoreOperationDAO {

    @Getter
    @Setter
    String name;

    @Getter
    @Setter
    ScoreOperationType operationType;
}
