package project.mebel.user.enums;

import lombok.Getter;

@Getter
public enum Role {
    ADMIN(0),
    OWNER(10),
    WORKER(100);

    private final int level;

    Role(int level) {
        this.level = level;
    }
}

