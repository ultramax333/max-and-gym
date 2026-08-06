/*
    This file is part of RepQuest.

    RepQuest is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    RepQuest is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with RepQuest.  If not, see <https://www.gnu.org/licenses/>.
 */
import React from "react";
import PropTypes from "prop-types";
import {Button, Stack, Typography} from '@mui/material';

const YoutubeEmbed = (props: { embedId: string }) => <Stack spacing={2} sx={{p: 3, alignItems: 'center'}}>
    <Typography>La vidéo externe n’est pas chargée automatiquement afin de préserver votre confidentialité.</Typography>
    <Button component="a" href={`https://www.youtube.com/watch?v=${encodeURIComponent(props.embedId)}`} target="_blank" rel="noreferrer" variant="contained">Ouvrir sur YouTube</Button>
</Stack>;

YoutubeEmbed.propTypes = {
    embedId: PropTypes.string.isRequired
};

export default YoutubeEmbed;
