package ru.korolenkoe.checkers;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;


@Controller
public class GameController {
    @RequestMapping(value = "/{path}", produces = MediaType.TEXT_HTML_VALUE)
    public String getPath(@PathVariable String path){
        return path;
    }
}
